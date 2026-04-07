package com.goroom.app.widget;

import android.content.Intent;
import android.widget.RemoteViewsService;

public class ScheduleRemoteViewsService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new ScheduleRemoteViewsFactory(this.getApplicationContext());
    }
}
