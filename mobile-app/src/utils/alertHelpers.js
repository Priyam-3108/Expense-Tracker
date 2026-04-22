/**
 * Alert Helper Utility
 * 
 * This utility provides helper functions to show custom alerts throughout the app.
 * Import this in any component and use the provided functions with your alert state.
 */

/**
 * Show a success alert
 * @param {Function} setAlertConfig - State setter for alert configuration
 * @param {Function} setShowAlert - State setter for alert visibility
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Function} onOk - Optional callback when OK is pressed
 */
export const showSuccessAlert = (setAlertConfig, setShowAlert, title, message, onOk) => {
    setAlertConfig({
        type: 'success',
        title,
        message,
        buttons: [
            {
                text: 'OK',
                style: 'primary',
                onPress: onOk
            }
        ]
    });
    setShowAlert(true);
};

/**
 * Show an error alert
 */
export const showErrorAlert = (setAlertConfig, setShowAlert, title, message, onOk) => {
    setAlertConfig({
        type: 'danger',
        title,
        message,
        buttons: [
            {
                text: 'OK',
                style: 'primary',
                onPress: onOk
            }
        ]
    });
    setShowAlert(true);
};

/**
 * Show a warning alert
 */
export const showWarningAlert = (setAlertConfig, setShowAlert, title, message, onOk) => {
    setAlertConfig({
        type: 'warning',
        title,
        message,
        buttons: [
            {
                text: 'OK',
                style: 'primary',
                onPress: onOk
            }
        ]
    });
    setShowAlert(true);
};

/**
 * Show a confirmation alert with Yes/No options
 */
export const showConfirmAlert = (setAlertConfig, setShowAlert, title, message, onConfirm, onCancel) => {
    setAlertConfig({
        type: 'warning',
        title,
        message,
        buttons: [
            {
                text: 'Cancel',
                style: 'cancel',
                onPress: onCancel
            },
            {
                text: 'Confirm',
                style: 'primary',
                onPress: onConfirm
            }
        ]
    });
    setShowAlert(true);
};

/**
 * Show a delete confirmation alert
 */
export const showDeleteConfirm = (setAlertConfig, setShowAlert, itemName, onDelete, onCancel) => {
    setAlertConfig({
        type: 'danger',
        title: `Delete ${itemName}`,
        message: `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
        buttons: [
            {
                text: 'Cancel',
                style: 'cancel',
                onPress: onCancel
            },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: onDelete
            }
        ]
    });
    setShowAlert(true);
};

export default {
    showSuccessAlert,
    showErrorAlert,
    showWarningAlert,
    showConfirmAlert,
    showDeleteConfirm
};
