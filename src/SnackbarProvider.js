import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { SnackbarContext, SnackbarContextNext } from './SnackbarContext';
import { TRANSITION_DELAY, TRANSITION_DOWN_DURATION, MESSAGES } from './utils/constants';
import SnackbarItem from './SnackbarItem';
import warning from './utils/warning';


class SnackbarProvider extends Component {
    state = {
        snacks: [],
    };

    queue = [];

    get offsets() {
        const { snacks } = this.state;
        return snacks.map((item, i) => {
            let index = i;
            let offset = 20;
            while (snacks[index - 1]) {
                offset += snacks[index - 1].height + 16;
                index -= 1;
            }
            return offset;
        });
    }

    /**
     * Adds a new snackbar to the queue to be presented.
     * @param {string} variant - type of the snackbar. can be:
     * (success, error, warning, info)
     * @param {string} message - text of the notification
     * @deprecated
     */
    handlePresentSnackbar = (variant, message) => {
        warning(MESSAGES.NO_ON_PRESENT_SNACKBAR);

        this.queue.push({
            message,
            variant,
            open: true,
            key: new Date().getTime() + Math.random(),
        });
        this.handleDisplaySnack();
    };

    /**
     * Adds a new snackbar to the queue to be presented.
     * @param {string} message - text of the notification
     * @param {object} options - additional options for the snackbar we want to enqueue.
     * We can pass Material-ui Snackbar props for individual customisation.
     * @param {string} options.variant - type of the snackbar. default value is 'default'.
     * can be: (default, success, error, warning, info)
     * @returns generated or user defined key referencing the new snackbar
     */
    handleEnqueueSnackbar = (message, { key, ...options } = {}) => {
        const id = key || new Date().getTime() + Math.random();
        this.queue.push({
            key: id,
            message,
            ...options,
            open: true,
        });

        this.handleDisplaySnack();
        return id;
    };

    /**
     * Display snack if there's space for it. Otherwise, immediately begin dismissing the
     * oldest message to start showing the new one.
     */
    handleDisplaySnack = () => {
        return this.processQueue();
    };

    /**
     * Display items (notifications) in the queue if there's space for them.
     */
    processQueue = () => {
        if (this.queue.length > 0) {
            const { maxSnack } = this.props,
            { snacks } = this.state,
            newOne = this.queue.shift();

            if (snacks.length >= maxSnack) {
                this.handleDismissOldest(
                    () => {
                        this.setState({snacks: [...this.state.snacks, newOne]});
                    }
                );
            }
            else {
                this.setState({snacks: [...snacks, newOne]});
            }
        }
    };

    /**
     * Hide oldest snackbar on the screen because there exists a new one which we have to display.
     * (ignoring the one with 'persist' flag. i.e. explicitly told by user not to get dismissed).
     */
    handleDismissOldest = (callback) => {
        let popped = false;
        let ignore = false;

        const persistentCount = this.state.snacks.reduce((acc, current) => (
            acc + (current.open && current.persist ? 1 : 0)
        ), 0);

        if (persistentCount === this.props.maxSnack) {
            warning(MESSAGES.NO_PERSIST_ALL);
            ignore = true;
        }

        this.setState(({ snacks }) => ({
            snacks: snacks
                .filter(item => item.open === true)
                .map((item) => {
                    if (!popped && (!item.persist || ignore)) {
                        popped = true;
                        if (item.onClose) item.onClose(null, 'maxsnack', item.key);
                        if (this.props.onClose) this.props.onClose(null, 'maxsnack', item.key);

                        return {
                            ...item,
                            open: false,
                        };
                    }

                    return {
                        ...item,
                    };
                }),
        }), callback);
    };

    /**
     * Hide a snackbar after its timeout.
     * @param {object} event - The event source of the callback
     * @param {string} reason - can be timeout or clickaway
     * @param {number} key - id of the snackbar we want to hide
     */
    handleCloseSnack = (event, reason, key) => {
        this.setState(({ snacks }) => ({
            snacks: snacks.map(item => (
                item.key === key ? { ...item, open: false } : { ...item }
            )),
        }));

        if (this.props.onClose) this.props.onClose(event, reason, key);
    };

    /**
     * Close snackbar with the given key
     * @param {number} key - id of the snackbar we want to hide
     */
    handleDismissSnack = (key) => {
        this.handleCloseSnack(null, null, key);
    }

    /**
     * When we set open attribute of a snackbar to false (i.e. after we hide a snackbar),
     * it leaves the screen and immediately after leaving animation is done, this method
     * gets called. We remove the hidden snackbar from state and then display notifications
     * waiting in the queue (if any).
     * @param {number} key - id of the snackbar we want to remove
     * @param {object} event - The event source of the callback
     */
    handleExitedSnack = (event, key) => {
        const enterDelay = TRANSITION_DELAY + TRANSITION_DOWN_DURATION + 40;
        this.setState(
            ({ snacks }) => ({
                snacks: snacks.filter(item => item.key !== key),
            }),
            () => setTimeout(this.handleDisplaySnack, enterDelay),
        );

        if (this.props.onExited) this.props.onExited(event, key);
    };

    /**
     * Sets height for a given snackbar
     * @param {number} height - height of snackbar after it's been rendered
     * @param {number} key - id of the snackbar we want to remove
     */
    handleSetHeight = (key, height) => {
        this.setState(({ snacks }) => ({
            snacks: snacks.map(item => (
                item.key === key ? { ...item, height } : { ...item }
            )),
        }));
    };

    render() {
        const { children, maxSnack, ...props } = this.props;
        const snacksWithIndex =  this.state.snacks.filter(i => !isNaN(i.forceIndex)).sort((a,b) => a.forceIndex - b.forceIndex);
        let snacks = this.state.snacks.filter(i => isNaN(i.forceIndex)).reverse(); // Snacks we dont care about the index

        for(var i = 0; i < snacksWithIndex.length; i++) {
            snacks.splice(snacksWithIndex[i].forceIndex, 0, snacksWithIndex[i]);
        }
        snacks.reverse();

        return (
            <SnackbarContext.Provider value={this.handlePresentSnackbar}>
                <SnackbarContextNext.Provider value={{
                    handleEnqueueSnackbar: this.handleEnqueueSnackbar,
                    handleCloseSnackbar: this.handleDismissSnack,
                }}>
                    <Fragment>
                        {children}
                        {snacks.map((snack, index) => (
                            <SnackbarItem
                                {...props}
                                key={snack.key}
                                snack={snack}
                                offset={this.offsets[index]}
                                onClose={this.handleCloseSnack}
                                onExited={this.handleExitedSnack}
                                onSetHeight={this.handleSetHeight}
                            />
                        ))}
                    </Fragment>
                </SnackbarContextNext.Provider>
            </SnackbarContext.Provider>
        );
    }
}

SnackbarProvider.propTypes = {
    children: PropTypes.element.isRequired,
    /**
     * Maximum snackbars that can be stacked
     * on top of one another
     */
    maxSnack: PropTypes.number,
    onClose: PropTypes.func,
    onExited: PropTypes.func,
};

SnackbarProvider.defaultProps = {
    maxSnack: 3,
    onClose: undefined,
    onExited: undefined,
};

export default SnackbarProvider;
