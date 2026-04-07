package com.goroom.app.widget;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import com.goroom.app.R;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class ScheduleRemoteViewsFactory implements RemoteViewsService.RemoteViewsFactory {

    private Context context;
    private List<ScheduleItem> schedules = new ArrayList<>();

    public ScheduleRemoteViewsFactory(Context context) {
        this.context = context;
    }

    @Override
    public void onCreate() {}

    @Override
    public void onDataSetChanged() {
        schedules.clear();
        SharedPreferences prefs = context.getSharedPreferences("goroom_widget_prefs", Context.MODE_PRIVATE);
        String userId = prefs.getString("userId", null);
        String supabaseUrl = prefs.getString("supabaseUrl", null);
        String supabaseKey = prefs.getString("supabaseKey", null);

        if (userId == null || supabaseUrl == null || supabaseKey == null) return;

        try {
            // 1. 사용자가 속한 방 ID 목록 조회
            String membersUrl = supabaseUrl + "/rest/v1/goroom_room_members?select=room_id&user_id=eq." + userId;
            String membersJson = httpGet(membersUrl, supabaseKey);
            JsonArray membersArr = JsonParser.parseString(membersJson).getAsJsonArray();

            if (membersArr.size() == 0) return;

            StringBuilder roomIds = new StringBuilder();
            for (int i = 0; i < membersArr.size(); i++) {
                if (i > 0) roomIds.append(",");
                roomIds.append(membersArr.get(i).getAsJsonObject().get("room_id").getAsString());
            }

            // 2. 오늘 날짜의 일정 조회
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
            String today = sdf.format(new Date());

            String schUrl = supabaseUrl + "/rest/v1/goroom_schedules?select=*&room_id=in.(" + roomIds + ")";
            String schJson = httpGet(schUrl, supabaseKey);
            JsonArray schArr = JsonParser.parseString(schJson).getAsJsonArray();

            // 3. 오늘 날짜 일정 필터 + 반복 확장
            for (int i = 0; i < schArr.size(); i++) {
                JsonObject s = schArr.get(i).getAsJsonObject();
                String date = getStr(s, "date");
                String title = getStr(s, "title");
                String time = getStr(s, "time");
                String color = getStr(s, "color");
                if (color.isEmpty()) color = "#4A90D9";

                // 오늘 날짜와 일치
                if (date.equals(today)) {
                    schedules.add(new ScheduleItem(title, time, color));
                }

                // 반복 일정 확장
                if (s.has("repeat") && !s.get("repeat").isJsonNull()) {
                    JsonObject repeat = s.getAsJsonObject("repeat");
                    String type = getStr(repeat, "type");
                    String endDate = getStr(repeat, "endDate");

                    if (type.isEmpty()) continue;
                    if (!endDate.isEmpty() && endDate.compareTo(today) < 0) continue;
                    if (date.compareTo(today) > 0) continue;

                    // 간단한 반복 체크
                    if (isRecurringToday(date, today, type, repeat)) {
                        if (!date.equals(today)) {
                            schedules.add(new ScheduleItem(title, time, color));
                        }
                    }
                }
            }

            // 시간순 정렬
            schedules.sort((a, b) -> a.time.compareTo(b.time));

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private boolean isRecurringToday(String origDate, String today, String type, JsonObject repeat) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
            Calendar orig = Calendar.getInstance();
            orig.setTime(sdf.parse(origDate));
            Calendar todayCal = Calendar.getInstance();
            todayCal.setTime(sdf.parse(today));

            if (orig.after(todayCal)) return false;

            Calendar cur = (Calendar) orig.clone();
            int interval = repeat.has("interval") ? repeat.get("interval").getAsInt() : 1;

            for (int i = 0; i < 1000; i++) {
                switch (type) {
                    case "daily": cur.add(Calendar.DAY_OF_MONTH, 1); break;
                    case "weekly": cur.add(Calendar.DAY_OF_MONTH, 7); break;
                    case "monthly": cur.add(Calendar.MONTH, 1); break;
                    case "yearly": cur.add(Calendar.YEAR, 1); break;
                    case "custom": cur.add(Calendar.DAY_OF_MONTH, interval); break;
                    default: return false;
                }
                if (cur.after(todayCal)) return false;
                if (sdf.format(cur.getTime()).equals(today)) return true;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    private String httpGet(String urlStr, String apiKey) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("apikey", apiKey);
        conn.setRequestProperty("Authorization", "Bearer " + apiKey);
        conn.setRequestProperty("Accept", "application/json");
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);

        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        reader.close();
        conn.disconnect();
        return sb.toString();
    }

    private String getStr(JsonObject obj, String key) {
        if (obj.has(key) && !obj.get(key).isJsonNull()) {
            return obj.get(key).getAsString();
        }
        return "";
    }

    @Override
    public void onDestroy() {
        schedules.clear();
    }

    @Override
    public int getCount() {
        return schedules.size();
    }

    @Override
    public RemoteViews getViewAt(int position) {
        if (position >= schedules.size()) return null;
        ScheduleItem item = schedules.get(position);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_schedule_item);
        views.setTextViewText(R.id.item_title, item.title);

        // 컬러바
        try {
            views.setInt(R.id.item_color_bar, "setBackgroundColor", Color.parseColor(item.color));
        } catch (Exception e) {
            views.setInt(R.id.item_color_bar, "setBackgroundColor", Color.parseColor("#4A90D9"));
        }

        // 시간
        if (!item.time.isEmpty()) {
            views.setTextViewText(R.id.item_time, item.time);
            views.setViewVisibility(R.id.item_time, View.VISIBLE);
        } else {
            views.setViewVisibility(R.id.item_time, View.GONE);
        }

        return views;
    }

    @Override
    public RemoteViews getLoadingView() { return null; }

    @Override
    public int getViewTypeCount() { return 1; }

    @Override
    public long getItemId(int position) { return position; }

    @Override
    public boolean hasStableIds() { return false; }

    static class ScheduleItem {
        String title;
        String time;
        String color;

        ScheduleItem(String title, String time, String color) {
            this.title = title;
            this.time = time;
            this.color = color;
        }
    }
}
