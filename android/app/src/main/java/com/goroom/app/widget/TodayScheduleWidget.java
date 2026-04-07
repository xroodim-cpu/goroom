package com.goroom.app.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

import com.goroom.app.MainActivity;
import com.goroom.app.R;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class TodayScheduleWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_today_schedule);

        // 날짜 표시
        SimpleDateFormat sdf = new SimpleDateFormat("M월 d일 EEEE", Locale.KOREAN);
        views.setTextViewText(R.id.widget_date, sdf.format(new Date()));

        // ListView 어댑터 연결
        Intent serviceIntent = new Intent(context, ScheduleRemoteViewsService.class);
        serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        serviceIntent.setData(Uri.parse(serviceIntent.toUri(Intent.URI_INTENT_SCHEME)));
        views.setRemoteAdapter(R.id.widget_schedule_list, serviceIntent);
        views.setEmptyView(R.id.widget_schedule_list, R.id.widget_empty);

        // 위젯 클릭 시 앱 열기
        Intent openIntent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, openIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_title, pendingIntent);

        // 리스트 아이템 클릭 시 앱 열기
        views.setPendingIntentTemplate(R.id.widget_schedule_list, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widget_schedule_list);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
    }
}
