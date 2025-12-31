/**
 * EventBus - Simple event system for component communication
 */
class EventBus {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (!this.events[event]) return;
        
        const index = this.events[event].indexOf(callback);
        if (index > -1) {
            this.events[event].splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }

    once(event, callback) {
        const onceCallback = (data) => {
            callback(data);
            this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
    }

    clear(event) {
        if (event) {
            delete this.events[event];
        } else {
            this.events = {};
        }
    }

    listEvents() {
        return Object.keys(this.events);
    }

    getListenerCount(event) {
        return this.events[event] ? this.events[event].length : 0;
    }
}

// Event constants
const EVENTS = {
    PROCESS_SELECTED: 'process:selected',
    PROCESS_LOADED: 'process:loaded',
    NETWORK_LOADED: 'network:loaded',
    SECURITY_SCAN_COMPLETE: 'security:scan:complete',
    TAB_CHANGED: 'tab:changed',
    THEME_CHANGED: 'theme:changed',
    ERROR_OCCURRED: 'error:occurred',
    DETAIL_PANEL_SHOW: 'detail:show',
    DETAIL_PANEL_HIDE: 'detail:hide'
};

module.exports = { EventBus, EVENTS };
