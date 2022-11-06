export function getAllTags(posts) {
    const allTags = new Set();
    posts.forEach((post) => {
        post.frontmatter.tags?.map((tag) => allTags.add(tag.toLowerCase()));
    });
    return [...allTags];
}
