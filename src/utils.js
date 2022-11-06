export function getAllTags(posts) {
    const allTags = new Set()
    posts.forEach((post) => {
        post.frontmatter.tags?.map((tag) => allTags.add(tag.toLowerCase()))
    })
    return [...allTags]
}

export function getAllTagsWithCount(posts) {
    return posts.reduce((prev, post) => {
        const currTags = { ...prev }
        post.frontmatter.tags?.forEach(function (tag) {
            currTags[tag] = (currTags[tag] || 0) + 1
        })
        return currTags
    }, {})
}
