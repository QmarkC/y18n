import {Y18N, Y18NOpts} from './Y18N';

function y18n(opts?: Y18NOpts): Y18N {
  return new Y18N(opts);
}

export default y18n;
