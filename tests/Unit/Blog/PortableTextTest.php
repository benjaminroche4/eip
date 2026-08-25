<?php

namespace Tests\Unit\Blog;

use App\Domain\Blog\Support\PortableText;
use App\Domain\Blog\Support\SanityImage;
use PHPUnit\Framework\TestCase;

class PortableTextTest extends TestCase
{
    private function body(): array
    {
        return [
            ['_key' => 'q', '_type' => 'quickAnswerBlock', 'content' => [
                ['_key' => 'l1', '_type' => 'block', 'style' => 'normal', 'listItem' => 'bullet', 'children' => [['_type' => 'span', 'text' => 'Point.']]],
            ]],
            ['_key' => 'w', '_type' => 'wysiwygBlock', 'content' => [
                ['_key' => 'p', '_type' => 'block', 'style' => 'normal', 'children' => [['_type' => 'span', 'text' => 'Premier '], ['_type' => 'span', 'text' => 'paragraphe.']]],
                ['_key' => 'i', '_type' => 'image', 'asset' => ['_ref' => 'image-abc-800x600-png']],
            ]],
            ['_key' => 'f', '_type' => 'faqBlock', 'items' => [['question' => 'Q ?', 'answer' => 'R.'], ['question' => '', 'answer' => 'ignored']]],
        ];
    }

    public function test_normalizes_images_and_extracts_faqs_and_first_paragraph(): void
    {
        $pt = new PortableText(new SanityImage('p', 'd'));
        $body = $pt->normalize($this->body());

        $this->assertSame(800, $body[1]['content'][1]['image']['width']);
        $this->assertArrayNotHasKey('image', $body[1]['content'][0]);
        $this->assertSame([['question' => 'Q ?', 'answer' => 'R.']], $pt->faqs($body));
        $this->assertSame('Premier paragraphe.', $pt->firstParagraph($body)); // list items are skipped
        $this->assertSame([], $pt->normalize(null));
    }
}
