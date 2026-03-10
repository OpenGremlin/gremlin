import { graphql } from "../generated/gql";

export const ProfileQuery = graphql(`
  query Profile {
    profile {
      displayName
      about
      website
      timezone
    }
  }
`);

export const UpdateProfileMutation = graphql(`
  mutation UpdateProfile($input: ProfileInput!) {
    updateProfile(input: $input) {
      displayName
      about
      website
      timezone
    }
  }
`);

export const AvatarsQuery = graphql(`
  query Avatars {
    avatars {
      id
      name
      url(width: 200)
    }
  }
`);
