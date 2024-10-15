import request from '@/axios'
import { coreInfoApi } from '@/constants/easytier'

export const getGithubVer = async () => {
  return request.get<GithubVer>({ url: coreInfoApi })
}
