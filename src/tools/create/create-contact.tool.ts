import { createXeroContact } from "../../handlers/create-xero-contact.handler.js";
import { z } from "zod";
import { DeepLinkType, getDeepLink } from "../../helpers/get-deeplink.js";
import { ensureError } from "../../helpers/ensure-error.js";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";

const contactSchema = z.object({
  name: z.string().describe("Full name of contact/organisation to create."),
  email: z.coerce.string().email().optional().describe("Optional email address."),
  phone: z.coerce.string().optional().describe("Optional phone number."),
});

type ContactInput = z.infer<typeof contactSchema>;

const CreateContactTool = CreateXeroTool(
  "create-contact",
  "Create a contact in Xero.\
  When a contact is created, a deep link to the contact in Xero is returned. \
  This deep link can be used to view the contact in Xero directly. \
  This link should be displayed to the user.",
  {
    properties: contactSchema.optional(),
  },
  async (params: { properties?: ContactInput } | ContactInput) => {
    try {
      // Extract the actual contact data, handling both formats
      const contactData = 'properties' in params ? params.properties : params as ContactInput;
      if (!contactData) {
        throw new Error("No contact data provided");
      }

      const response = await createXeroContact(
        contactData.name,
        contactData.email,
        contactData.phone
      );
      if (response.isError) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error creating contact: ${response.error}`,
            },
          ],
        };
      }

      const contact = response.result;

      const deepLink = contact.contactID
        ? await getDeepLink(DeepLinkType.CONTACT, contact.contactID)
        : null;

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Contact created: ${contact.name} (ID: ${contact.contactID})`,
              deepLink ? `Link to view: ${deepLink}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);

      return {
        content: [
          {
            type: "text" as const,
            text: `Error creating contact: ${err.message}`,
          },
        ],
      };
    }
  },
);

export default CreateContactTool;
