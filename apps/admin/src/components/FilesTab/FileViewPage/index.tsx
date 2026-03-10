import { useSearchParams } from "react-router-dom";
import { WorkspaceFileQuery } from "../../../graphql/queries";
import { useQuery } from "../../../hooks/useQuery";
import { useTitle } from "../../../hooks/useTitle";
import { BackButton } from "../../../shared/BackButton";
import { QueryResult } from "../../../shared/QueryResult";

export function FileViewPage() {
  const [params] = useSearchParams();
  const filePath = params.get("path") ?? "";
  const fileName = filePath.split("/").pop() ?? filePath;
  useTitle(fileName || "File");

  const { data, loading, error } = useQuery(WorkspaceFileQuery, {
    path: filePath,
  });

  return (
    <div>
      <div className="px-6 pt-6 pb-2">
        <BackButton />
        <h1 className="text-neutral-200 text-sm font-medium mt-3 break-all">
          {fileName}
        </h1>
        <p className="text-neutral-600 text-xs mt-1 break-all">{filePath}</p>
      </div>

      <QueryResult loading={loading} error={error} />

      {data?.workspaceFile != null ? (
        <pre className="px-6 py-3 text-xs text-neutral-300 font-mono whitespace-pre-wrap break-all overflow-x-auto">
          {data.workspaceFile}
        </pre>
      ) : (
        !loading &&
        !error && (
          <p className="px-6 py-8 text-sm text-neutral-500 text-center">
            Unable to display file (binary or too large)
          </p>
        )
      )}
    </div>
  );
}
