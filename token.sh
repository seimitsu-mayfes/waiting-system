curl -v -X POST https://api.line.me/oauth2/v2.1/token \
-H 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=client_credentials' \
--data-urlencode 'client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer' \
--data-urlencode 'client_assertion=eyJhbGciOiJSUzI1NiIsImtpZCI6IjBiYmRjYzIxLTk1NjAtNGY1Mi04NzA3LWRjZmQ3MjE5ODM4MyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIyMDA2NjA4NDIyIiwic3ViIjoiMjAwNjYwODQyMiIsImF1ZCI6Imh0dHBzOi8vYXBpLmxpbmUubWUvIiwiZXhwIjoxNzMyNjExMjc1LCJ0b2tlbl9leHAiOjI1OTIwMDB9.c-2uiqbTO92Us9L3UDKGWkWlvhUwj684e1s7wY1CTZDEAW7W54SqgI2eupd1lFkiDQlHkPHOGyIT4bZ5qqGIWIEaXFMsFQWEsPE0_1jvSJUXwZ0jY_fO3ov8LOsi2EQBjlHzxrhbyMAr2nDpFc55sU3RgnwL3XEq3srBEIiPK4MqaCyW0YtJV-Hq77WGEqfJQNHRdFs67OuuPr09wQoVHyBGPiJuVqObOKGqh9qWgsn29PRLYlTvn7Fjcl3qjzwWPlHVGEQSm6Da7S9S55c0t9BQ_vQI980hRTLHfRo5GuoONbCnIAjaeHSesJL7FPUo3j16E4g8U0ZhlsVQ75FCIw'