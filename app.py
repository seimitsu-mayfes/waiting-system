from jwcrypto import jwk
import json
key = jwk.JWK.generate(kty='RSA', alg='RS256', use='sig', size=2048)

private_key = key.export_private()
public_key = key.export_public()

print("=== private key ===\n"+json.dumps(json.loads(private_key),indent=2))
print("=== public key ===\n"+json.dumps(json.loads(public_key),indent=2))