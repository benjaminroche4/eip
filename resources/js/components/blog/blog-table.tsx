import { type TableSection } from './types';

type BlogTableProps = { section: TableSection };

const cellClass = 'border-border border px-6 text-left align-middle';

/**
 * Article table (Figma 712-21382, square corners per the site rule): grey header row with small medium labels,
 * tall body rows, first column muted, values in the heading colour. Scrolls horizontally when too wide.
 */
export default function BlogTable({ section }: BlogTableProps) {
    const rows = section.table?.rows ?? [];
    if (rows.length === 0) return null;
    const [head, ...body] = section.firstRowIsHeader ? rows : [null, ...rows];

    return (
        <div className="my-8 overflow-x-auto">
            <table className="w-full border-collapse text-sm/6">
                {section.caption && <caption className="text-muted-foreground mb-2 text-left text-xs">{section.caption}</caption>}
                {head && (
                    <thead>
                        <tr className="bg-grey-5">
                            {head.cells.map((c, i) => (
                                <th key={i} scope="col" className={`${cellClass} text-muted-foreground h-11 text-xs font-medium`}>
                                    {c}
                                </th>
                            ))}
                        </tr>
                    </thead>
                )}
                <tbody>
                    {body.map((row) => (
                        <tr key={row!._key} className="bg-card">
                            {row!.cells.map((c, i) =>
                                section.firstColumnIsHeader && i === 0 ? (
                                    <th key={i} scope="row" className={`${cellClass} text-muted-foreground h-17 font-normal`}>
                                        {c}
                                    </th>
                                ) : (
                                    <td
                                        key={i}
                                        className={`${cellClass} h-17 font-medium ${i === 0 ? 'text-muted-foreground font-normal' : 'text-text-heading'}`}
                                    >
                                        {c}
                                    </td>
                                ),
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
