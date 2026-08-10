package org.springframework.samples.smartcheckin.statistics.events;

import org.springframework.context.ApplicationEvent;

public class FormationAttendanceEvent extends ApplicationEvent {

    public FormationAttendanceEvent(Object source) {
        super(source);
    }
}
