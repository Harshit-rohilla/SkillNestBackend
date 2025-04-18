class apiError extends Error{
    constructor(statusCode,message="something went wrong"){
        super(message)
        this.statusCode=statusCode
        this.message=message
        this.success=false
    }
}
export {apiError}