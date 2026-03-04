interface Window {
  JapanAI?: {
    getContext: () => {
      userId: string;
      email: string;
      userName: string;
      memberRole: string;
      orgId: string;
      orgName: string;
      projectId: string;
      pageId: string;
    };
    openTask: (data: object | object[] | null, userPrompt?: string) => void;
  };
}
