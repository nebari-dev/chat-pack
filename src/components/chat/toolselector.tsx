/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  SelectInstance, MultiValue 
} from 'react-select';

import Select from 'react-select';

import * as Hrafnar from '@/hrafnar';

import {
  useAppStore
} from '@/store';


/**
 * A React component which renders the tool selector dropdown.
 *
 * This component hooks into the store to get the available tools.
 *
 * #### Notes
 * This is an uncontrolled component and the consumer will provide a ref
 * for the `<select>` element in order to retrieve its current value.
 */
export
function ToolSelector(props: ToolSelector.Props) {
  // Extract the props.
  const { tools, setTools } = props;

  // Fetch the available tools from the store.
  const availableTools = useAppStore(s => s.tools);

  // Return the rendered component.
  return (
    <Select<Hrafnar.Tool, true>
      menuPlacement="auto"
      isMulti
      value={tools}
      onChange={(vals: MultiValue<Hrafnar.Tool>) => {
        setTools(vals as Hrafnar.Tool[]);
      }}
      getOptionLabel={t => t.display_name}
      getOptionValue={t => t.name}
      options={availableTools}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
    />
  );
}


/**
 * The namespace for the `toolSelector` component statics.
 */
export
namespace ToolSelector {
  /**
   * A type alias for the file selector instance.
   */
  export
  type Instance = SelectInstance<Hrafnar.Tool, true>;

  /**
   * A type alias for the `ToolSelector` props.
   */
  export
  type Props = {
    /**
     * The selected tool for the selector.
     */
    readonly tools: Hrafnar.Tool[];   

    /**
     * The callback to set the selected tool.
     */
    readonly setTools: (tools: Hrafnar.Tool[]) => void;
  };
}
