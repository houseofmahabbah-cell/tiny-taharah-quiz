exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let name, email;

  try {
    const body = JSON.parse(event.body);
    name = body.name;
    email = body.email;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: "Email is required" }) };
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;

  if (!apiKey || !groupId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  // Split name into first and last
  const nameParts = (name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  try {
    const response = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        fields: {
          name: firstName,
          last_name: lastName,
        },
        groups: [groupId],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("MailerLite error:", data);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Could not subscribe. Please try again." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Network error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Network error. Please try again." }),
    };
  }
};
