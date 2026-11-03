import type { AppSection } from './section';

type BaseProps = {
  section?: AppSection;
  page_name?: string;
};

export type AnalyticsEvent =
  | { name: 'system_app_loaded'; properties: BaseProps & { locale: string; is_mobile: boolean } }
  | {
      name: 'navigation_sidebar_clicked';
      properties: BaseProps & { destination: string; source_page: string };
    }
  | {
      name: 'navigation_mobile_nav_used';
      properties: BaseProps & { destination: string };
    }
  | {
      name: 'navigation_language_changed';
      properties: BaseProps & { from_locale: string; to_locale: string };
    }
  | {
      name: 'navigation_home_card_clicked';
      properties: BaseProps & { card_id: string; destination: string };
    }
  | {
      name: 'explorer_page_viewed';
      properties: BaseProps & { tool: string };
    }
  | {
      name: 'explorer_data_connected';
      properties: BaseProps & { tool: string; source: 'api' | 'websocket' | 'fallback' };
    }
  | {
      name: 'explorer_data_failed';
      properties: BaseProps & { tool: string; error_type: string; duration_ms?: number };
    }
  | {
      name: 'explorer_search_submitted';
      properties: BaseProps & { search_type: string; has_result: boolean };
    }
  | {
      name: 'explorer_decoder_submitted';
      properties: BaseProps & { input_type: string; success: boolean; error_code?: string };
    }
  | {
      name: 'explorer_rpc_command_sent';
      properties: BaseProps & { command_name: string };
    }
  | {
      name: 'academy_lesson_started';
      properties: BaseProps & { path_id: string; lesson_id: string; node_id?: string };
    }
  | {
      name: 'academy_lesson_completed';
      properties: BaseProps & { path_id: string; lesson_id: string; time_on_page_sec?: number };
    }
  | {
      name: 'lab_tool_opened';
      properties: BaseProps & { tool: string };
    }
  | {
      name: 'lab_action_run';
      properties: BaseProps & { tool: string; action: string; success: boolean };
    }
  | {
      name: 'system_error_shown';
      properties: BaseProps & { error_type: string; tool?: string };
    };

export type AnalyticsEventName = AnalyticsEvent['name'];

export type AnalyticsEventProperties<TName extends AnalyticsEventName> = Extract<
  AnalyticsEvent,
  { name: TName }
>['properties'];
