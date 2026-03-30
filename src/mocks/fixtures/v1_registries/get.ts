import type { GetV1RegistriesResponse } from "@api/types.gen";
import { AutoAPIMock } from "@mocks";

export const mockedGetV1Registries = AutoAPIMock<GetV1RegistriesResponse>({
  registries: [
    {
      name: "default",
      createdAt: "2024-01-01T00:00:00.000Z",
      creationType: "CONFIG",
    },
  ],
});
