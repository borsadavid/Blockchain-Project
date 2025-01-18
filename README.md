Custom token transactions


Installation guide:    

ETHEREUM BL:
add MyToken.sol into an anvil project in ``/src``
    
Run ``anvil``    
Run ``forge create --rpc-url http://127.0.0.1:8545 \
  --private-key <private-key> \
  src/MyToken.sol:MyToken --broadcast`` 
    
Add an account to MetaMask (choose import account), and enter the private key of one of the generated accounts when running ``anvil``.      
Go to tokens -> import token, and import the locally deployed token (address is returned by second ran command).       
RC is the custom token (Ronaldo Coin)     
![image](https://github.com/user-attachments/assets/1620e823-017d-425a-b91d-bcfb89f89f45)      
      
      
SOLANA BL:
follow this: https://solana.com/docs/intro/installation     

set to local-host: ``solana config set --url localhost``    
aidrop some sol: ``solana airdrop 5000``    
run blockchain locally: ``solana-test-validator``    
    
Create a token: ``spl-token create-token``
Create an account for that token: ``spl-token create-account <token-mint-address>``     
Mint some tokens to the account: ``spl-token mint <token-mint-address> 5000 <created-account-address>     

Connect to phantom wallet:   
Add a wallet using the private key that you got on config following https://solana.com/docs/intro/installation ("my-solana-wallet.json")     
Also use this private key on frontend config tutorial.    
![image](https://github.com/user-attachments/assets/5d2ca26f-e6b0-4fe1-a343-3deec72086c0)




   


