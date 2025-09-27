/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import type {
  SelectInstance
} from 'react-select';

import Select from 'react-select';

import * as Hrafnar from '@/hrafnar';

import {
  useAppStore
} from '@/store';


/**
 * A React component which renders the files selector dropdown.
 *
 * This component hooks into the store to get the available files.
 *
 * #### Notes
 * This is an uncontrolled component and the consumer will provide a ref
 * for the `<select>` element in order to retrieve its current value.
 */
export
function FilesSelector(props: FilesSelector.Props): ReactNode {
  // Extract the props.
  const { selectedFiles, setSelectedFiles } = props;

  // Fetch the available files from the store.
  const files = useAppStore(store => store.files);

  // Return the rendered component.
  return (
    <Select
      value={ selectedFiles }
      onChange={ setSelectedFiles }
      isMulti={ true }
      closeMenuOnSelect={ false }
      menuPlacement='auto'
      placeholder='Select Files...'
      getOptionLabel={ f => f.name }
      getOptionValue={ f => f.id }
      options={ files } />
  );
}


/**
 * The namespace for the `FilesSelector` component statics.
 */
export
namespace FilesSelector {
  /**
   * A type alias for the file selector instance.
   */
  export
  type Instance = SelectInstance<Hrafnar.FileInfo, true>;

  /**
   * A type alias for the `FilesSelector` props.
   */
  export
  type Props = {
    /**
     *
     */
    readonly selectedFiles: readonly Hrafnar.FileInfo[];

    /**
     *
     */
    readonly setSelectedFiles: (files: readonly Hrafnar.FileInfo[]) => void;
  };
}
