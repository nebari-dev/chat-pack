/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  clsx
} from 'clsx';

import type {
  ReactNode
} from 'react';


/**
 * A React component which shows default content when there are no open chats.
 */
export
function Onboarding(): ReactNode {
  return (
    <div className={ clsx(
      'w-150 p-8 bg-bg-white border border-neutral-default',
      'rounded-md text-text-neutral-default'
      ) }>
      <h2 className='font-bold text-xl'>
        AI Overview
      </h2>
      <ul className='mt-6 list-disc'>
        <li className='ml-6'>Shown when there are no open chats.</li>
        <li className='ml-6'>
          Add what to expect from AI, things can go wrong,
          necessary warnings here.
        </li>
      </ul>
      <p className='mt-6'>
        Vitae quam ac posuere nibh viverra. Nunc feugiat eget tortor enim ut
        suscipit urna congue. Pulvinar pellentesque consectetur habitasse enim
        porttitor gravida tincidunt imperdiet vitae. Fames massa felis dictumst
        lacus. Nulla nam pellentesque sagittis porttitor fames. Ut duis urna
        quis urna ipsum diam magna.
      </p>
      <p className='mt-6'>
        Magna mollis elit ullamcorper eget amet ut a. Facilisis volutpat massa
        adipiscing ut etiam risus fermentum. Malesuada vitae hendrerit pretium
        ornare convallis blandit integer odio. Eu curabitur in aliquet a non
        habitant lacinia adipiscing. Sed aliquet malesuada nulla risus placerat
        mattis. Vulputate velit in mi aliquam. Elementum purus tortor urna
        purus sit massa. Elementum cras nisl est aliquam vulputate facilisis
        ultricies. Adipiscing interdum imperdiet faucibus in mattis sit amet
        vitae sociis. Egestas convallis vel nunc tellus diam massa consectetur
        ac fringilla.
      </p>
    </div>
  );
}
