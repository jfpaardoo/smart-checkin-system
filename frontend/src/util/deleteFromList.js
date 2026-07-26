import tokenService from "../services/token.service";


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
    const jwt = tokenService.getLocalAccessToken();
    const entityName = options.entityName || "Item";
    const t = options.t;

    const confirmMsg = t
        ? t(`${entityName.toLowerCase()}s.deleteConfirm`, { defaultValue: `Are you sure you want to delete this ${entityName.toLowerCase()}?` })
        : `Are you sure you want to delete this ${entityName.toLowerCase()}?`;

    toast.confirm(confirmMsg, () => {
        fetch(url, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${jwt}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
                if (response.status === 200 || response.status === 204) {
                    if (options.filtered && options.setFiltered) {
                        setState(state.filter((i) => i.id !== id));
                        options.setFiltered(options.filtered.filter((i) => i.id !== id));
                    } else {
                        setState(state.filter((i) => i.id !== id));
                    }
                    const successMsg = t
                        ? t(`${entityName.toLowerCase()}s.deleted`, { defaultValue: `${entityName} deleted successfully` })
                        : `${entityName} deleted successfully`;
                    toast.success(successMsg);
                } else {
                    return response.json().then((json) => {
                        const errorMsg = t
                            ? t(`${entityName.toLowerCase()}s.deleteError`, { defaultValue: `Failed to delete ${entityName.toLowerCase()}` })
                            : json.message || `Failed to delete ${entityName.toLowerCase()}`;
                        toast.error(json.message || errorMsg);
                    });
                }
            })
            .catch((err) => {
                console.error(err);
                const connMsg = t
                    ? t('common.connectionError', { defaultValue: "Connection error. Please try again." })
                    : "Connection error. Please try again.";
                toast.error(connMsg);
            });
    });
}
