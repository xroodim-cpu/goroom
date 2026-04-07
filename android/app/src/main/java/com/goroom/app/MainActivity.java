package com.goroom.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.goroom.app.plugins.GoRoomWidgetPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoRoomWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
