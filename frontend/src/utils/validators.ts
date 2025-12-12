export function isSupportedFileType(fileName: string): boolean {
  const allowed = ['pdf', 'doc', 'docx', 'txt', 'md']
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? allowed.includes(extension) : false
}
