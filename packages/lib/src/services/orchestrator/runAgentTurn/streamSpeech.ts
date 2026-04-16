import type { SpeechAudioEvent } from "../../../resources/pubsub.js";
import type { ServiceContext } from "../../context.js";
import { SentenceAccumulator } from "../../speech/SentenceAccumulator.js";
import { buildSpeechUrl } from "../../speech/signedSpeechUrl.js";
import { stripMarkdownForSpeech } from "../../speech/stripMarkdownForSpeech.js";

export interface SpeechConfig {
  voice: string | undefined;
  connectionId: string;
}

interface SpeechPipeline {
  /** Feed new text deltas; each complete sentence triggers a TTS request. */
  pushText: (text: string) => void;
  /** Flush the remaining buffer and emit the done event. Must be called once at end. */
  finish: () => void;
}

/** No-op pipeline used when speech is disabled, so callers don't need branching. */
const inertPipeline: SpeechPipeline = {
  pushText: () => {},
  finish: () => {},
};

/**
 * Build the sentence-streaming TTS pipeline. Returns an inert no-op pipeline
 * when speech is disabled or `serverBaseUrl` is missing — callers can invoke
 * the methods unconditionally.
 */
export function createSpeechPipeline(
  ctx: ServiceContext,
  opts: {
    agentId: string;
    taskId: string | null;
    streamLogId: string;
    speech: SpeechConfig | undefined;
  },
): SpeechPipeline {
  const speechCfg =
    opts.speech && ctx.serverBaseUrl
      ? {
          voice: opts.speech.voice,
          connectionId: opts.speech.connectionId,
          baseUrl: ctx.serverBaseUrl,
        }
      : null;

  if (!speechCfg) return inertPipeline;

  const accumulator = new SentenceAccumulator();
  let sentenceIndex = 0;

  const publishSpeech = (event: SpeechAudioEvent) => {
    if (opts.taskId) {
      ctx.resources.pubsub.publish(`speechAudio:task:${opts.taskId}`, event);
    } else {
      ctx.resources.pubsub.publish(`speechAudio:${opts.agentId}`, event);
    }
  };

  const emitSentence = (sentence: string) => {
    const cleaned = stripMarkdownForSpeech(sentence);
    if (!cleaned) return;
    const url = buildSpeechUrl(speechCfg.baseUrl, {
      text: cleaned,
      voice: speechCfg.voice,
      connectionId: speechCfg.connectionId,
    });
    publishSpeech({
      logId: opts.streamLogId,
      agentId: opts.agentId,
      sentenceIndex: sentenceIndex++,
      url,
      done: false,
    });
  };

  return {
    pushText: (text: string) => {
      for (const sentence of accumulator.push(text)) {
        emitSentence(sentence);
      }
    },
    finish: () => {
      const remaining = accumulator.flush();
      if (remaining) emitSentence(remaining);
      publishSpeech({
        logId: opts.streamLogId,
        agentId: opts.agentId,
        sentenceIndex,
        url: "",
        done: true,
      });
    },
  };
}
