package org.springframework.samples.smartcheckin.statistics.events;

import org.springframework.context.ApplicationEvent;

public class CheckinEvent extends ApplicationEvent {

    public CheckinEvent(Object source) {
        super(source);
    }
}
