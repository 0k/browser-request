import { t, e } from "@0k/types-request"


if (!AbortSignal.timeout) {
  AbortSignal.timeout = ms => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(new DOMException("TimeoutError")), ms)
    return controller.signal
  }
}

const httpRequest = async (opts: t.coreHttpOpts) => {
    let body: Blob
    if (opts.data) {
        if (typeof opts.data === "object") {
            body = new Blob([JSON.stringify(opts.data)], {
                type: "application/json",
            })
        } else if (typeof opts.data === "string") {
            body = new Blob([opts.data])
        }
    }

    let url = `${opts.protocol}://${opts.host}`
    if (opts.port) url += `:${opts.port}`
    if (opts.path) url += `/${opts.path.replace(/^\//, '')}`

    const fetchOpts = {
        method: opts.method,
        ...(opts.headers && { headers: opts.headers }),
        ...(opts.port && { port: opts.port }),
        ...(opts.data && { body }),
        ...(opts.timeout && { signal: AbortSignal.timeout(opts.timeout) }),
    }

    let response
    try {
        response = await fetch(url, fetchOpts)
    } catch (err) {
        console.error(
            `Encountered an error trying to make a request: ${err.message}`
        )
        throw new e.RequestFailed(err.message)
    }

    if (!response.ok) {
        throw new e.HttpError(
            response.status,
            response.statusText,
            await response.text(),
            response
        )
    }

    if (opts.responseHeaders) {
        for (const [header, value] of response.headers) {
            opts.responseHeaders[header] = value
        }
    }

    return await response.text()
}

export { httpRequest, e, t }
