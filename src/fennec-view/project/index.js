import nodeAssetCopier from './nodeAssetCopier'
import projectSave from './projectSave'
import projectLoad from './projectLoad'
import projectWallpaper from './projectWallpaper'

const projectMethods = {
    ...nodeAssetCopier,
    ...projectSave,
    ...projectLoad,
    ...projectWallpaper
}

export default projectMethods
