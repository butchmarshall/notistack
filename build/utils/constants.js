'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var TRANSITION_DELAY = exports.TRANSITION_DELAY = 150;

var TRANSITION_DOWN_DURATION = exports.TRANSITION_DOWN_DURATION = 200;

var MESSAGES = exports.MESSAGES = {
    NO_ON_PRESENT_SNACKBAR: 'DEPRECATION - notistack: Method \'onPresentSnackbar\' has  been  deprecated and will be removed in future versions. Please use \'enqueueSnackbar\' method instead. See https://github.com/iamhosseindhv/notistack#enqueuesnackbar for more info.',
    NO_PERSIST_ALL: 'WARNING - notistack: Reached maxSnack while all enqueued snackbars have \'persist\' flag. Notistack will dismiss the oldest snackbar anyway to allow other ones in the queue to be presented.'
};