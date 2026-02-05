/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/


/**
 * A type alias for a quick prompt for a specific agent.
 *
 * This type is used to render the suggested prompts for an agent, before
 * user input has been submitted in the chat input for an agent/session.
 */
export
type QuickPrompt = {
  /**
   * The title of the quick prompt.
   *
   * This is used to render the title of the quick prompt card.
   */
  readonly title: string;

  /**
   * The short description of the quick prompt.
   *
   * This is used to render the description of the quick prompt card.
   */
  readonly description: string;

  /**
   * The actual user input for the quick prompt.
   *
   * This will be used as the agent prompt if the user clicks the card.
   */
  readonly prompt: string;
};


/**
 * A type alias for the details of an Agent in the application.
 *
 * This type is used to populate the agent dropdown selector, the chat
 * quick prompts, and other UI areas where the agent detail is needed.
 *
 * This type is part of the `AppConfig` type, which is made available to
 * the entire Chat++ application.
 */
export
type AgentDetail = {
  /**
   * The unique id of the agent.
   */
  readonly agentId: string;

  /**
   * The human readable name of the agent.
   */
  readonly agentName: string;

  /**
   * The introduction message to the user.
   *
   * This is a short description of what the agent does and will be shown
   * at the start of an empty session.
   */
  readonly introduction: string;

  /**
   * The unique id of the model underlying the agent.
   */
  readonly modelId: string;

  /**
   * The human readable name of the model underlying the agent.
   */
  readonly modelName: string;

  /**
   * The provider hosting the underlying model.
   */
  readonly modelProvider: string;

  /**
   * The quick prompts to show for the agent in a new empty chat.
   */
  readonly quickPrompts: readonly QuickPrompt[];
};


/**
 * The global application config object.
 */
export
type Config = {
  /**
   * The unique id of the application.
   */
  readonly appId: string;

  /**
   * The human readable name of the application.
   */
  readonly appName: string;

  /**
   * The agents available to the application.
   */
  readonly agents: readonly AgentDetail[];
};


/**
 * Fetch the application config.
 *
 * This defines the top-level application config which, among other
 * things, defines which agents are available to the application.
 *
 * @returns The global application config object.
 */
export
type GetConfig = () => Promise<Config>;
