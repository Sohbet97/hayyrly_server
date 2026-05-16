const { pool } = require('../../config/db');

async function createNewMarka(image = null, name) {
    try {
       
        const query = ` 
            INSERT INTO markas (name, image_url) VALUES ($1, $2)
            RETURNING id, name, image_url;`;
        const values = [name, image ?? null];
        const res = await pool.query(query, values);
        return res.rows[0];
    } catch (error) {
        throw error;
    }
}

async function getAllMarka() {
    try {
        const query = 'SELECT id, name, image_url FROM markas ORDER BY id DESC;'
        const res = await pool.query(query);
        return res.rows;

    } catch (error) {
        throw error;
    }

}

async function deleteMarka(markaId) {
    try {
        const query = 'DELETE FROM markas WHERE id = $1 RETURNING id, name, image_url;';
        const res = await pool.query(query, [markaId]);
        if (res.rowCount === 0) {
            throw new Error('Marka not found');
        }
        return res.rows[0];
    } catch (error) {
        throw error;

    }

}

async function updateMarka(markaId, newData) {
    try {
        const { name, image } = newData;
        const updates = [];
        const values = [];
        let queryIndex = 1;

        if (name) {
            updates.push(`name = $${queryIndex}`);
            values.push(name);
            queryIndex++;
        }

        if (image) {
            updates.push(`image_url = $${queryIndex}`);
            values.push(image);
            queryIndex++;
        }


        if (updates.length === 0) {
            return { message: "Нет данных для обновления" };
        }


        values.push(markaId);


        const query = `
            UPDATE markas 
            SET ${updates.join(', ')} 
            WHERE id = $${queryIndex}
            RETURNING *;
        `;

        const result = await pool.query(query, values);
        return result.rows[0];

    } catch (error) {
        throw error;
    }
}

async function getMarkaTree() {
    try {
        const query = `
            SELECT m.id, m.name, m.image_url, mo.id as model_id, mo.name as model_name
            FROM markas m
            LEFT JOIN models mo ON m.id = mo.marka_id
        `;

        const { rows } = await pool.query(query);

        const tree = rows.reduce((acc, row) => {
            let marka = acc.find(item => item.id === row.id);

            if (!marka) {
                marka = {
                    id: row.id,
                    name: row.name,
                    image_url: row.image_url,
                    models: []
                };
                acc.push(marka);
            }

            if (row.model_id) {
                marka.models.push({
                    id: row.model_id,
                    name: row.model_name
                });
            }

            return acc;
        }, []);

        return tree;
    } catch (error) {
        console.error("Error building tree:", error);
        throw error;
    }
}


// models

async function createNewModel(data) {
    try {
        const { marka_id, name } = data;
        const query = `
            INSERT INTO models (marka_id, name) 
            VALUES ($1, $2) 
            RETURNING id, marka_id, name;
        `;
        const values = [marka_id, name];

        const { rows } = await pool.query(query, values);
        return rows[0];
    } catch (error) {
        throw error;
    }
}

async function deleteModel(modelId) {
    try {
        const query = 'DELETE FROM models WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [modelId]);

        if (rows.length === 0) {
            throw new Error("Модель не найдена");
        }
        return { message: "Модель успешно удалена", deleted: rows[0] };
    } catch (error) {
        throw error;
    }

}

async function updateModel(modelId, newData) {
    try {
        const { name, marka_id } = newData;
        const updates = [];
        const values = [];
        let index = 1;

        if (name) {
            updates.push(`name = $${index++}`);
            values.push(name);
        }
        if (marka_id) {
            updates.push(`marka_id = $${index++}`);
            values.push(marka_id);
        }

        if (updates.length === 0) return null;

        values.push(modelId);
        const query = `
            UPDATE models 
            SET ${updates.join(', ')} 
            WHERE id = $${index} 
            RETURNING *;
        `;

        const { rows } = await pool.query(query, values);
        return rows[0];
    } catch (error) {
        throw error;
    }

}


async function getModels(filter) {
    try {
        const { marka_id } = filter;
        let query = 'SELECT * FROM models';
        const values = [];

        if (marka_id) {
            query += ' WHERE marka_id = $1';
            values.push(marka_id);
        }

        query += ' ORDER BY name ASC';

        const { rows } = await pool.query(query, values);
        return rows;
    } catch (error) {
        throw error;
    }

}

module.exports = {
    deleteMarka,
    getAllMarka,
    updateMarka,
    createNewMarka,

    getModels,
    updateModel,
    deleteModel,
    createNewModel,

    getMarkaTree

}