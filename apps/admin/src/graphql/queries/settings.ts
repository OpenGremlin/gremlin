import { graphql } from "../generated/gql";

export const GlobalSettingsQuery = graphql(`
  query GlobalSettings {
    globalSettings {
      signupDisabled
    }
  }
`);

export const UpdateGlobalSettingsMutation = graphql(`
  mutation UpdateGlobalSettings($signupDisabled: Boolean) {
    updateGlobalSettings(signupDisabled: $signupDisabled) {
      signupDisabled
    }
  }
`);
