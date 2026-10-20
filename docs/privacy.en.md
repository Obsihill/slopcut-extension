# SlopCut privacy policy

Prepared: October 17, 2026. Applies to SlopCut (딸깍컷) 1.5.0–1.6.1 for Microsoft Edge and 1.6.0–1.6.1 for Google Chrome.

SlopCut identifies seller labels, seller links/IDs or BOOTH shop subdomains, and product-card boundaries in the DOM of supported marketplace pages. It uses these locally to place buttons and hide sellers explicitly chosen by the user. It does not classify AI content or take action on marketplace accounts.

Local extension storage contains selected sellers' site, ID/subdomain, display name and time added, global/site hiding preferences, and theme preference. Chrome and Edge lists are separate and are not automatically shared. A localStorage theme cache is also kept on the extension's own origin; its legacy key slopblock.theme is retained for update compatibility. There is no developer-operated account service or server copy.

The extension does not transmit your blocked list or preferences to its developer or third parties, use analytics/advertising/crash-reporting SDKs, load remote executable code, or record browsing history. It does not read cookie values, credentials, payment records or purchase history. Starting in 1.6.0, TurboSquid cards without a seller label use a same-origin request to the website's public quick-preview HTML for cards near the viewport. Requests are limited to two at once and results are reused within the page. They do not include your block list, and returned scripts are not executed. Normal same-origin cookie handling applies; SlopCut does not read or store cookie values. If the site refuses a preview, a card may have no seller button. The original websites retain their own independent network activity and privacy practices. Opening a seller link visits that website. Distribution and hosting platforms such as Chrome Web Store, Microsoft Edge Add-ons and GitHub/GitHub Pages apply their own policies to their services.

SlopCut complies with the Chrome Web Store User Data Policy, including its Limited Use requirements. Seller information and saved choices are used only for seller filtering and list management. They are not used or transferred for personalized advertising, data sales, credit decisions, or unrelated purposes. The developer has no feature for accessing users' local lists.

A user-initiated JSON export contains the blocked sellers' site, ID, display name and time added, but not theme or hiding preferences. Import reads a user-selected local file and merges valid seller entries; it does not upload them. Users control backup-file storage and sharing.

Unblock a seller or clear the list to remove seller records. Uninstalling removes the browser's extension storage. Separately exported backup files must be deleted by the user. The developer cannot recover local data from a server.

The dust effect uses locally generated masks and particles, not screenshots or product-image pixel extraction. Directly requested effects play even when OS reduced motion is enabled; hidden tabs skip them.

Contact the publisher through Issues in the official slopcut-extension GitHub repository. Do not include private data or a full block list in a public report. Changes to data practices will be reflected in this policy and its date.
