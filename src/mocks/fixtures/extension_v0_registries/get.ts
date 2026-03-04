import type { GetExtensionV0RegistriesResponse } from "@api/types.gen";
import { AutoAPIMock } from "@mocks";

export const mockedGetExtensionV0Registries =
  AutoAPIMock<GetExtensionV0RegistriesResponse>({
    registries: [
      {
        name: "Ut est",
        createdAt: "id",
        creationType: "CONFIG",
        filterConfig: {
          names: {
            exclude: ["tempor in Lorem"],
            include: ["occaecat id"],
          },
          tags: {
            exclude: ["dolor dolore"],
            include: ["Ut tempor sit anim enim"],
          },
        },
      },
    ],
  });
