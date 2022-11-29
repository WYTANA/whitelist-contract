import Head from "next/head"
import styles from "../styles/Home.module.css"
import image from "../public/white-none.svg"
import Image from "next/image"
import Web3Modal from "web3modal"
import { providers, Contract } from "ethers"
import { useEffect, useRef, useState } from "react"
import { WHITELIST_CONTRACT_ADDRESS, abi } from "../constants/index"

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false)
  const [joinedWhitelist, setJoinedWhitelist] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0)
  const web3ModalRef: any = useRef()

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = web3ModalRef.current.connect()
    const web3Provider = new providers.Web3Provider(provider)

    const { chainId } = await web3Provider.getNetwork()
    if (chainId !== 5) {
      window.alert("Change your network to Goerli")
      throw new Error("Change your network to Goerli")
    }

    if (needSigner) {
      const signer = web3Provider.getSigner()
      return signer
    }
    return web3Provider
  }

  const addAddressToWhitelist = async () => {
    try {
      const signer = await getProviderOrSigner(true)

      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      )

      const tx = await whitelistContract.addAddressToWhitelist()
      setIsLoading(true)

      await tx.wait()
      setIsLoading(false)
      await getNumberOfWhitelisted()
      setJoinedWhitelist(true)
    } catch (err) {
      console.error(err)
    }
  }

  const getNumberOfWhitelisted = async () => {
    try {
      const provider = await getProviderOrSigner()

      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      )

      const _numberOfWhitelisted =
        await whitelistContract.numAddressesWhitelisted()
      setNumberOfWhitelisted(_numberOfWhitelisted)
    } catch (err) {
      console.error(err)
    }
  }

  const checkIfAddressInWhitelist = async () => {
    try {
      const signer: any = await getProviderOrSigner(true)
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      )

      const address = await signer.getAddress()

      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
        address
      )
      setJoinedWhitelist(_joinedWhitelist)
    } catch (err) {
      console.error(err)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const connectWallet = async () => {
    try {
      await getProviderOrSigner()
      setWalletConnected(true)

      checkIfAddressInWhitelist()
      getNumberOfWhitelisted()
    } catch (err) {
      console.error(err)
    }
  }

  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
          <div className={styles.description}>
            Thanks for joining the Whitelist!
          </div>
        )
      } else if (isLoading) {
        return <button className={styles.button}>Loading...</button>
      } else {
        return (
          <button onClick={addAddressToWhitelist} className={styles.button}>
            Join the Whitelist
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
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      })
      connectWallet()
    }
  }, [walletConnected])

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div className={styles.main}>
        <div>
          <Image
            className={styles.image}
            src={image}
            alt="logo"
            width={50}
            height={25}
          />
        </div>
        <div className={styles.div}>
          <h1 className={styles.title}>Welcome to Wytana Strategies!</h1>
          <div className={styles.description}>
            Join the wait for the ICO token!
          </div>
          <div className={styles.description}>
            {numberOfWhitelisted} have already joined the Whitelist
          </div>
          {renderButton()}
          <div>
            Verified on{" "}
            <a href="https://goerli.etherscan.io/address/0x47CD3d925bFf4b20498580cAF125582558C6809F">
              Goerli Etherscan
            </a>{" "}
          </div>
        </div>
      </div>

      <footer className={styles.footer}>&#xA9;2022 Wytana Strategies</footer>
    </div>
  )
}
