import { registerPlugin } from '@capacitor/core';

export interface GoRoomWidgetPlugin {
  saveUserSession(options: { userId: string; supabaseUrl: string; supabaseKey: string }): Promise<void>;
  refreshWidget(): Promise<void>;
}

const GoRoomWidget = registerPlugin<GoRoomWidgetPlugin>('GoRoomWidget', {
  web: () => ({
    async saveUserSession() {},
    async refreshWidget() {},
  }),
});

export default GoRoomWidget;
