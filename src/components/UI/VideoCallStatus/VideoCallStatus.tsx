import styles from './VideoCallStatus.module.scss'

interface VideoCallStatusProps {
  isConnected: boolean
  isConnecting: boolean
}

export default function VideoCallStatus({
  isConnected,
  isConnecting,
}: VideoCallStatusProps) {
  return (
    <div className={styles.connectionStatus}>
      <strong
        className={`${
          isConnected
            ? styles.connected
            : isConnecting
              ? styles.connecting
              : styles.disconnected
        }`}>
        {isConnected ? ' ' : isConnecting ? 'Connecting...' : 'Disconnected'}
      </strong>
    </div>
  )
}
