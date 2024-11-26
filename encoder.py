import jwt
from jwt.algorithms import RSAAlgorithm
import time

privateKey = {
  "alg": "RS256",
  "d": "AXtsSRIqTpqVd_4jksw-t0iSZPktDzGj5iCwCAtRGOsLVNguWuq7lLKza9wv-V8QdJCciMI_tcV3IWLMm2XoTCRCXTPq1dCcirVGGQybeYZbjiaqcH0x7GKYVvFAg4qKf16yxWq18ntuChV4ncafk1agtyLz4-geA-gmMIqrGl2eIO7s-xhgLlNI-DQEGFm_WjdmWrS-jMfhq-4TM4Bg7XaiFe8N3bEyiJy2lycAurJO4MaYIGVmnu4Q6LFcZk5W3HzCe52OadCDiGFIQj_M9UOGPbGOwjjwlhYFfdxdL93ssg-xvactxPRUsfs_tyit-1yAJQxSjkylcCIhomjrgQ",
  "dp": "DbsfxBcBXQlsrNJ0yLhojnTbWOey8rgt_uoWFji11oPZwsaKENMN-AheiGVltHmkak3ZBPeeKRNTizkKvFr6FE6fHZANa-LvkBkdugNC4KWrY9ui-c6o5OknUetFip-8j-1GCMGgC_7AbeWedi1mGxSXdNIRLiiMXANMAtX9lQE",
  "dq": "yaNTcBak5ilz8b5OUC0O39V719xdqWSWY4QcZH4TBFJLR52JCEbcJgHr5yIrquE_5vbVUkoboNNcGi7Ui1bdHMcRcKjtWXuE0NWfrzoXYhuP9b-RbEI5IJi_69rvECyeBi1AsVinSUMETqbHHFB9gwaUZ35vmy8ygWvpHaDpkoE",
  "e": "AQAB",
  "kty": "RSA",
  "n": "1ZGd_KpXC18zcKtuUm2yaREXfXQ3OouS0D1xO2ces_yfXr62xtAMoCd30efqFMcEeFnVXCc-GleulOjiGmSDCRKu9evUFhAID2AJMBCePZw0xh0b6fuoqN8F01-yxT8HKWAndzZqj6xtEEtBd5GYDwfODax_1TnlfQOtgaBSwtBUPoXSFRf_5wWxUvy6C4oIya0yk1IvbQBRGndCi1rp0S4s4ZdVp7z539iHk02aEtVwBVjCk93wdrAYJAOJK5hzNFixscZNXIhcD6DuTTTrVHKFSuBeO6-N6q-dl8J6Igm1DM0TPae26io73nWNvl7hqiq-jEFBbRWhY_GOWSNcoQ",
  "p": "9zimfEGmQyZhNoPFJX_O-ID4hz9JUB1OtJzD0cd1iWb7ZvvW4fpJ7DDZO1pzeOvOw_T7Il2eJl0o-HISYkz4oqbIB9GCzxNfTJEB6HBPC0qNVFPAPgFQtVAxKmFMXuTvqOuaBipBGTvzYuMMpR_PFZHmx9fpgqdHxpY50gEnmGE",
  "q": "3ScNFN-FbEotelvWSD8g3SdRvYbZM3I1R3aPuuFU1FlrNU7S9p34U40oD-USn6-SOMTr8i9osYjD5hn9w6zsD0UQEJB9c-AD5D-mFhAV60KCOqhd5HoA9GFxWtRSaFzOTmpdM6XcyrSYfdUhhkZSFXSxBCaWqF19OxKhUQYFLEE",
  "qi": "fy4dlyGR87qxXw93KczmDJiIaNV652FstRq0KxPHzVjfVFLSgjSw-ZONhpMbrv0tWOqECERSxoEK2GcXR_A2-fTD31spDyWGO4G2P6hDbcpc9WafVmoCCOJXy6tRxo71xzenfT8RTH4joO7F1UQw7JrdWcyuazrt15xW47c2c8w",
  "use": "sig"
}

headers = {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "0bbdcc21-9560-4f52-8707-dcfd72198383"
}

payload = {
  "iss": "2006608422",
  "sub": "2006608422",
  "aud": "https://api.line.me/",
  "exp":int(time.time())+(60 * 30),
  "token_exp": 60 * 60 * 24 * 30
}

key = RSAAlgorithm.from_jwk(privateKey)

JWT = jwt.encode(payload, key, algorithm="RS256", headers=headers, json_encoder=None)
print(JWT)