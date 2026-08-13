import api from "../services/api";

/**
 * Function to delete an item from a list via a DELETE request and update the state accordingly.
 * Uses the centralized Toast notification system for all feedback.
 *
 * @param {string} url - The URL to send the DELETE request to.
 * @param {string} id - The unique identifier of the item to be deleted.
 * @param {[Array, function]} state - An array containing the current state and the state setter function.
 * @param {object} toast - The toast API from useToast() hook.
 * @param {object} [options={}] - Optional parameters:
 *   - `filtered` {Array}: An optional filtered list that needs to be updated.
 *   - `setFiltered` {function}: A function to update the `filtered` state.
 *   - `entityName` {string}: Human-readable name of the entity for success messages (e.g. "User", "Formation").
 *   - `t` {function}: Optional i18next translation function. If provided, toast messages will be translated.
 */
export default function deleteFromList(url, id, [state, setState], toast, options = {}) {
    const entityName = options.entityName || "Item";
    const t = options.t;

    const confirmMsg = t
        ? (options.confirmMessage || t(`common.deleteConfirm`, { defaultValue: `¿Estás seguro de que quieres eliminar: ${entityName}?`, entity: entityName }))
        : (options.confirmMessage || `¿Estás seguro de que quieres eliminar: ${entityName}?`);

    toast.confirm(confirmMsg, () => {
        api.delete(url)
            .then((response) => {
                if (response.status === 200 || response.status === 204) {
                    if (options.filtered && options.setFiltered) {
                        setState((prevState) => prevState.filter((i) => i.id !== id));
                        options.setFiltered((prevFiltered) => prevFiltered.filter((i) => i.id !== id));
                    } else {
                        setState((prevState) => prevState.filter((i) => i.id !== id));
                    }
                    const successMsg = t
                        ? t('common.deleted', { defaultValue: `${entityName} deleted successfully`, entity: entityName })
                        : `${entityName} deleted successfully`;
                    toast.success(successMsg);
                }
            })
            .catch((error) => {
                console.error(error);
                if (error.response.data) {
                    const errorMsg = t
                        ? t('common.deleteError', { defaultValue: `Failed to delete ${entityName}`, entity: entityName })
                        : error.response.data.message || `Failed to delete ${entityName}`;
                    toast.error(error.response.data.message || errorMsg);
                } else {
                    const connMsg = t
                        ? t('common.connectionError', { defaultValue: "Connection error. Please try again." })
                        : "Connection error. Please try again.";
                    toast.error(connMsg);
                }
            });
    });
}
