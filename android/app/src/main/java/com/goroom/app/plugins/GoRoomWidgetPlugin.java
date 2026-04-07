package com.goroom.app.plugins;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.goroom.app.widget.TodayScheduleWidget;

@CapacitorPlugin(name = "GoRoomWidget")
public class GoRoomWidgetPlugin extends Plugin {

    @PluginMethod
    public void saveUserSession(PluginCall call) {
        String userId = call.getString("userId");
        String supabaseUrl = call.getString("supabaseUrl");
        String supabaseKey = call.getString("supabaseKey");

        if (userId == null || supabaseUrl == null || supabaseKey == null) {
            call.reject("Missing parameters");
            return;
        }

        SharedPreferences prefs = getContext().getSharedPreferences("goroom_widget_prefs", Context.MODE_PRIVATE);
        prefs.edit()
            .putString("userId", userId)
            .putString("supabaseUrl", supabaseUrl)
            .putString("supabaseKey", supabaseKey)
            .apply();

        call.resolve();
    }

    @PluginMethod
    public void refreshWidget(PluginCall call) {
        Context context = getContext();
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName widget = new ComponentName(context, TodayScheduleWidget.class);
        int[] widgetIds = appWidgetManager.getAppWidgetIds(widget);

        if (widgetIds.length > 0) {
            Intent intent = new Intent(context, TodayScheduleWidget.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds);
            context.sendBroadcast(intent);
        }

        call.resolve();
    }
}
