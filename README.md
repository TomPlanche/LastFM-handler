# LastFM_handler middleware.
LastFM API middleware using Typescript.

It misses a lot of API calls but I need what I implemented for my project and I'm a bit lazy to implement the rest.

## Other usage:
For an other project, I needed to hide the network calls by using a server side API call. Instead of calling the LastFM API directly.
```typescript
/**
 * @function fetchData
 * @description Fetches data from the LastFM API.
 *
 * @param method {Method} The method to call.
 * @param params {T_GoodParams} The params to use.
 *
 * @returns {Promise<T_allResponse | T_ErrorRes>}
 */
private fetchData: T_fetchData = async (
    method: Method,
    params: Partial<T_GoodParams>
): Promise<T_allResponse | T_ErrorRes> => {
    // same code as before.
    return new Promise((resolve, reject) => {
        axios
            .post('/api/last-fm', {
                url // post url to the server. No need to expose the API key.
            })
    });
};
```
