import { getAccessToken } from './googleAuth';

/**
 * Creates RFC 2822 standard email message and base64url encodes it for Gmail API.
 */
function createRfc2822Message(
  to: string, 
  from: string, 
  subject: string, 
  bodyText: string, 
  bodyHtml?: string
): string {
  const boundary = `__boundary_${Date.now()}__`;
  
  const message = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyText,
    ''
  ];

  if (bodyHtml) {
    message.push(
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      bodyHtml,
      ''
    );
  }

  message.push(`--${boundary}--`);
  
  const rawString = message.join('\r\n');
  return btoa(unescape(encodeURIComponent(rawString)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends an email directly via the official Gmail REST API using the user's OAuth access token.
 */
export async function sendEmailViaGmailApi(
  recipientEmail: string,
  subject: string,
  bodyText: string,
  bodyHtml?: string,
  sender = 'me'
): Promise<{ success: boolean; id?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { 
      success: false, 
      error: 'Gmail access token not available. Please connect with your Google/Gmail account.' 
    };
  }

  try {
    const raw = createRfc2822Message(recipientEmail, sender, subject, bodyText, bodyHtml);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gmail API error (${response.status})`);
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('Failed to send email via Gmail API:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Lists latest emails from Gmail to allow end-to-end inbox check in boutique executive suite.
 */
export async function listGmailMessages(maxResults = 5, query = ''): Promise<any[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    url.searchParams.set('maxResults', maxResults.toString());
    if (query) url.searchParams.set('q', query);

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return [];
    const data = await response.json();
    if (!data.messages) return [];

    const details = await Promise.all(
      data.messages.slice(0, maxResults).map(async (msg: { id: string }) => {
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (msgRes.ok) return msgRes.json();
        return null;
      })
    );

    return details.filter(Boolean);
  } catch (err) {
    console.error('Error fetching Gmail messages:', err);
    return [];
  }
}
