exports.anotherGreet = async (event) => {
  try {
    // Parse the JSON body of the request
    const body = JSON.parse(event.body);

    // Extract the 'name' property from the body
    const name = body.name;

    // If 'name' is not provided, return a 400 error response
    if(!name){
        return{
            statusCode: 400,
            body: JSON.stringify(
                {msg: "Name is required"}
            ),
        }
    }

    // Return a 200 response with a greeting message
    return {
      statusCode: 200,
      body: JSON.stringify(
        {msg: `Hello, ${name}! Greeting from anotherGreet function.`}
      ),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(
        {msg: "Internal Server Error"}
      ),
    };
  }
};
