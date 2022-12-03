import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"
import Web3Modal from "web3modal"
import { providers, Contract } from "ethers"
import { useEffect, useRef, useState } from "react"

import { WHITELIST_CONTRACT_ADDRESS, abi } from "../constants"
import logo from "../public/white-none.svg"
import scan from "../public/logos/etherscan-logo-light.png"

export default function Home() {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [isWhitelisted, setIsWhitelisted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [whitelistedAddresses, setWhitelistedAddresses] = useState(0)
  const web3ModalRef = useRef()

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    const provider = await web3ModalRef.current.connect()
    const web3Provider = new providers.Web3Provider(provider)

    // Error if Goerli not connected
    const { chainId } = await web3Provider.getNetwork()
    if (chainId !== 5) {
      window.alert("Please connect to Goerli testnet!")
      throw new Error("Please change to Goerli network!")
    }

    if (needSigner) {
      const signer = web3Provider.getSigner()
      return signer
    }
    return web3Provider
  }

  const addAddressToWhitelist = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true)
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      )
      // call the addAddressToWhitelist from the contract
      const tx = await whitelistContract.addAddressToWhitelist()
      setLoading(true)
      // wait for the transaction to get mined
      await tx.wait()
      setLoading(false)
      // get the updated number of addresses in the whitelist
      await getNumberOfWhitelisted()
      setIsWhitelisted(true)
    } catch (err) {
      console.error(err)
    }
  }

  const getNumberOfWhitelisted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner()
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      )
      // call the numAddressesWhitelisted from the contract
      const _whitelistedAddresses =
        await whitelistContract.numAddressesWhitelisted()
      setWhitelistedAddresses(_whitelistedAddresses)
    } catch (err) {
      console.error(err)
    }
  }

  const checkIfAddressInWhitelist = async () => {
    try {
      // We will need the signer later to get the user's address
      // Even though it is a read transaction, since Signers are just special kinds of Providers,
      // We can use it in it's place
      const signer = await getProviderOrSigner(true)
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      )
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress()
      // call the whitelistedAddresses from the contract
      const _isWhitelisted = await whitelistContract.whitelistedAddresses(
        address
      )
      setIsWhitelisted(_isWhitelisted)
    } catch (err) {
      console.error(err)
    }
  }

  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner()
      setIsWalletConnected(true)

      checkIfAddressInWhitelist()
      getNumberOfWhitelisted()
    } catch (err) {
      console.error(err)
    }
  }

  const renderButton = () => {
    if (isWalletConnected) {
      if (isWhitelisted) {
        return (
          <div className={styles.description}>
            Thanks for joining the Whitelist!
          </div>
        )
      } else if (loading) {
        return <button className={styles.button}>Loading...</button>
      } else {
        return (
          <button onClick={addAddressToWhitelist} className={styles.button}>
            <strong>Join Whitelist!</strong>
          </button>
        )
      }
    } else {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      )
    }
  }

  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!isWalletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      })
      connectWallet()
    }
  }, [isWalletConnected])

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist Promotion" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div className={styles.main}>
        <div className={styles.div}>
          <div>
            <Image
              className={styles.image}
              src={logo}
              alt="wytana strategies logo"
              width={50}
              height={25}
            />
          </div>
          <h1 className={styles.title}>Welcome to the WS Token ICO!</h1>
          <div className={styles.description}>
            Get your tokens before the public sale.
          </div>
          <div className={styles.description}>
            Addresses whitelisted:{" "}
            <strong>
              <u className={styles.num}>{whitelistedAddresses}</u>
            </strong>
          </div>
          {renderButton()}
        </div>
      </div>

      <footer className={styles.footer}>
        &#169;2022 Wytana Strategies
        <a
          href="https://goerli.etherscan.io/address/0x47CD3d925bFf4b20498580cAF125582558C6809F"
          target="_blank"
          rel="noreferrer"
        >
          <Image src={scan} alt="etherscan" width={190.05} height={42.7} />{" "}
        </a>{" "}
      </footer>
    </div>
  )
}
