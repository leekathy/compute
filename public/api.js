/* FILE: api.js
 * Author: leekathy
 * This file contains the apiRequest function, which handles requests to the REST API.
 */

let API_URL = "/api"

/* FUNCTION: apiRequest
 * --------------------
 * Parameters:
 *     method - HTTP method
 *     path   - resource path
 *     body   - request body (empty if GET request)
 * This function transmits a request from the client-side and returns a reponse from the server-side.
 */
const apiRequest = async (method, path, body = null) => {
    try {
        let res;
        if (body != null) {
            res = await fetch(API_URL + path, {
                method: `${method}`,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
        } else {
            res = await fetch(API_URL + path, {
                method: `${method}`
            });
        }
        let status = res.status;
        let json = await res.json();
        return [status, json];
    } catch (e) {
        alert(e.message);
        throw (e)
    } 
};

export default apiRequest;
