export type GmailMessage = {
  id: string;
  subject: string;
  body: string;
  from: string;
  receivedAt: string;
};
export type GmailCategory =
  "confirmation" | "assessment" | "interview" | "recruiter" | "rejection" | "offer" | "other";
export interface GmailConnector {
  search(query: string): Promise<GmailMessage[]>;
  classify(message: GmailMessage): GmailCategory;
  draftReply(message: GmailMessage, context: string): Promise<string>;
  sendDraft(draft: string, approved: boolean): Promise<void>;
}

export class MockGmailConnector implements GmailConnector {
  readonly sent: string[] = [];
  constructor(private readonly messages: GmailMessage[]) {}
  async search(query: string): Promise<GmailMessage[]> {
    const term = query.toLowerCase();
    return this.messages.filter((message) =>
      `${message.subject} ${message.body} ${message.from}`.toLowerCase().includes(term),
    );
  }
  classify(message: GmailMessage): GmailCategory {
    const text = `${message.subject} ${message.body}`.toLowerCase();
    if (/offer|congratulations.*position/.test(text)) return "offer";
    if (/unfortunately|not moving forward|other candidates/.test(text)) return "rejection";
    if (/interview|schedule.*call/.test(text)) return "interview";
    if (/assessment|coding challenge|take.home/.test(text)) return "assessment";
    if (/application.*received|thanks for applying/.test(text)) return "confirmation";
    if (/recruiter|talent acquisition/.test(text)) return "recruiter";
    return "other";
  }
  async draftReply(message: GmailMessage, context: string): Promise<string> {
    return `Re: ${message.subject}\n\n${context}`;
  }
  async sendDraft(draft: string, approved: boolean): Promise<void> {
    if (!approved) throw new Error("Sending Gmail requires explicit user review and approval");
    this.sent.push(draft);
  }
}
