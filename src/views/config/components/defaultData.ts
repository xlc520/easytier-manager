const defaultFormData: FormData | any = {
  hostname: '',
  instance_name: '',
  network_identity: {
    network_name: '',
    network_secret: ''
  },
  dhcp: true,
  ipv4: undefined,
  peer: [{ uri: undefined }],
  listeners: [],
  proxy_network: [{ cidr: undefined }],
  exit_nodes: [],
  rpc_portal: '0.0.0.0:15888',
  console_logger: { level: undefined },
  file_logger: {
    level: 'error',
    file: 'easytier',
    dir: ''
  },
  flags: {
    default_protocol: 'tcp',
    dev_name: 'easytier',
    disable_encryption: false,
    disable_ipv6: false,
    latency_first: true,
    enable_exit_node: false,
    no_tun: false,
    use_smoltcp: false,
    disable_p2p: false,
    disable_udp_hole_punching: false,
    multi_thread: true,
    relay_all_peer_rpc: false,
    manual_routes: undefined,
    ipv6_listener: undefined,
    socks5: undefined,
    relay_network_whitelist: '*'
  }
}
export default { defaultFormData }
