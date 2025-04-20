function buildCategoryTree(categories) {
    const map = {};
    const roots = [];

    categories.forEach(cat => {
        const catId = cat._id.toString();
        map[catId] = { ...cat._doc, children: [] };
    });

    categories.forEach(cat => {
        const catId = cat._id.toString();
        const parentId = cat.parent?.toString();

        if (parentId && map[parentId]) {
            map[parentId].children.push(map[catId]);
        } else {
            roots.push(map[catId]);
        }
    });

    return roots;
}

function buildCategoryTreeWithParent(categories) {
    const map = {};
    const roots = [];

    categories.forEach(cat => {
        map[cat.name] = { ...cat._doc, children: [] };
    });

    categories.forEach(cat => {
        if (cat.parent) {
            map[cat.parent]?.children.push(map[cat.name]);
        } else {
            roots.push(map[cat.name]);
        }
    });

    return roots;
}

module.exports = {
    buildCategoryTree,
    buildCategoryTreeWithParent,
};